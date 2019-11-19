import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, Pagination, Filter } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    option: 'open',
    page: 1,
  };

  async componentDidMount() {
    const { repository, issues } = await this.fetchIssues();

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  async componentDidUpdate(prevProps, prevState) {
    const { option, page } = this.state;

    if (prevState.option !== option || prevState.page !== page) {
      const { repository, issues } = await this.fetchIssues();

      this.setState({
        repository: repository.data,
        issues: issues.data,
        loading: false,
      });
    }
  }

  fetchIssues = async () => {
    const { match } = this.props;
    const { option, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          // passing query params with axios
          state: option,
          per_page: 5,
          page,
        },
      }),
    ]);

    return {
      repository,
      issues,
    };
  };

  handleChangeFilter = e => {
    this.setState({
      option: e.target.value,
    });
  };

  handlePagination = async action => {
    const { page } = this.state;
    await this.setState({
      page: action === 'previous' ? page - 1 : page + 1,
    });
  };

  render() {
    const { repository, issues, loading, option, page } = this.state;

    if (loading) {
      return <Loading>Loading</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Go Back to Repositories</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <Filter>
          <label htmlFor="select">Issue Filter</label>
          <select id="select" value={option} onChange={this.handleChangeFilter}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
        </Filter>

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>

        <Pagination>
          <button
            type="button"
            onClick={() => {
              this.handlePagination('previous');
            }}
            disabled={page < 2}
          >
            Previous
          </button>
          <span>{page}</span>

          <button
            type="button"
            onClick={() => {
              this.handlePagination('next');
            }}
          >
            Next
          </button>
        </Pagination>
      </Container>
    );
  }
}
